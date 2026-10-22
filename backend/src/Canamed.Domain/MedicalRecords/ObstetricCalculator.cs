namespace Canamed.Domain.MedicalRecords;

public enum GestationalAgeReference
{
    Dum = 1,
    FirstUltrasound = 2
}

public sealed record GestationalAge(int Weeks, int Days)
{
    public int TotalDays => (Weeks * 7) + Days;
    public override string ToString() => $"{Weeks}s {Days}d";
}

public sealed record ObstetricCalculationResult(
    GestationalAge? GestationalAgeByDum,
    DateOnly? EddByDum,
    GestationalAge? GestationalAgeByUsg,
    DateOnly? EddByUsg,
    GestationalAgeReference PreferredReference,
    GestationalAge? EffectiveGestationalAge,
    DateOnly? EffectiveEdd,
    int? DiscrepancyDays,
    bool IsDumUncertain,
    string ClinicalRecommendation);

public static class ObstetricCalculator
{
    /// <summary>
    /// Calcula a Data Provável do Parto (DPP) pela Regra de Naegele:
    /// Se mês de 1 a 3: dia + 7, mês + 9, ano mantido.
    /// Se mês de 4 a 12: dia + 7, mês - 3, ano + 1.
    /// </summary>
    public static DateOnly CalculateNaegeleEdd(DateOnly dum)
    {
        var tempDate = dum.AddDays(7);
        if (dum.Month <= 3)
        {
            return new DateOnly(dum.Year, tempDate.Month + 9, tempDate.Day);
        }

        // AddYears(1) e subtrai 3 meses com segurança de dias no mês
        var nextYear = tempDate.AddYears(1);
        return nextYear.AddMonths(-3);
    }

    /// <summary>
    /// Calcula a idade gestacional (semanas e dias) entre a data de início e a data alvo.
    /// </summary>
    public static (int Weeks, int Days) CalculateGestationalAge(DateOnly baseDate, DateOnly targetDate)
    {
        if (targetDate < baseDate)
        {
            return (0, 0);
        }

        var totalDays = targetDate.DayNumber - baseDate.DayNumber;
        return (totalDays / 7, totalDays % 7);
    }

    /// <summary>
    /// Calcula a idade gestacional na data alvo a partir de uma USG anterior com semanas e dias conhecidos.
    /// </summary>
    public static (int Weeks, int Days) CalculateFromUltrasound(
        DateOnly usgDate,
        int usgWeeks,
        int usgDays,
        DateOnly targetDate)
    {
        var diffDays = targetDate.DayNumber - usgDate.DayNumber;
        var totalDays = (usgWeeks * 7) + usgDays + diffDays;
        if (totalDays < 0) totalDays = 0;
        return (totalDays / 7, totalDays % 7);
    }

    /// <summary>
    /// Reconciliação obstétrica entre DUM e 1º Ultrassom (CCN precoce), conforme diretrizes FEBRASGO/ACOG.
    /// </summary>
    public static ObstetricCalculationResult Reconcile(
        DateOnly? dum,
        bool isDumUncertain,
        DateOnly targetDate,
        DateOnly? firstUsgDate = null,
        int? firstUsgWeeks = null,
        int? firstUsgDays = null,
        double? firstUsgCcnMm = null)
    {
        GestationalAge? gaDum = null;
        DateOnly? eddDum = null;

        if (dum.HasValue && !isDumUncertain)
        {
            var (w, d) = CalculateGestationalAge(dum.Value, targetDate);
            gaDum = new GestationalAge(w, d);
            eddDum = CalculateNaegeleEdd(dum.Value);
        }

        GestationalAge? gaUsg = null;
        DateOnly? eddUsg = null;

        if (firstUsgDate.HasValue && firstUsgWeeks.HasValue)
        {
            var (w, d) = CalculateFromUltrasound(firstUsgDate.Value, firstUsgWeeks.Value, firstUsgDays ?? 0, targetDate);
            gaUsg = new GestationalAge(w, d);

            // A DPP pelo USG é calculada assumindo 280 dias totais a partir da DUM estimada pelo USG
            var estimatedDumFromUsg = firstUsgDate.Value.AddDays(-((firstUsgWeeks.Value * 7) + (firstUsgDays ?? 0)));
            eddUsg = estimatedDumFromUsg.AddDays(280);
        }

        if (isDumUncertain || !dum.HasValue)
        {
            return new ObstetricCalculationResult(
                GestationalAgeByDum: null,
                EddByDum: null,
                GestationalAgeByUsg: gaUsg,
                EddByUsg: eddUsg,
                PreferredReference: GestationalAgeReference.FirstUltrasound,
                EffectiveGestationalAge: gaUsg,
                EffectiveEdd: eddUsg,
                DiscrepancyDays: null,
                IsDumUncertain: true,
                ClinicalRecommendation: "DUM incerta/desconhecida. Idade gestacional e DPP baseadas exclusivamente no 1º Ultrassom precoce.");
        }

        if (gaUsg == null)
        {
            return new ObstetricCalculationResult(
                GestationalAgeByDum: gaDum,
                EddByDum: eddDum,
                GestationalAgeByUsg: null,
                EddByUsg: null,
                PreferredReference: GestationalAgeReference.Dum,
                EffectiveGestationalAge: gaDum,
                EffectiveEdd: eddDum,
                DiscrepancyDays: null,
                IsDumUncertain: false,
                ClinicalRecommendation: "Idade gestacional calculada com base na DUM informada. Aguardando USG para correlação.");
        }

        // Calcula a discrepância em dias
        var discrepancy = Math.Abs(gaDum!.TotalDays - gaUsg.TotalDays);

        // Critério FEBRASGO/ACOG:
        // No 1º trimestre (até 8 semanas e 6 dias pelo USG ou CCN até 20mm), discrepância > 5 dias adota USG.
        // Entre 9s e 13s 6d, discrepância > 7 dias adota USG.
        var maxAllowedDiscrepancy = (firstUsgWeeks!.Value <= 8) ? 5 : 7;

        if (discrepancy > maxAllowedDiscrepancy)
        {
            return new ObstetricCalculationResult(
                GestationalAgeByDum: gaDum,
                EddByDum: eddDum,
                GestationalAgeByUsg: gaUsg,
                EddByUsg: eddUsg,
                PreferredReference: GestationalAgeReference.FirstUltrasound,
                EffectiveGestationalAge: gaUsg,
                EffectiveEdd: eddUsg,
                DiscrepancyDays: discrepancy,
                IsDumUncertain: false,
                ClinicalRecommendation: $"Discrepância de {discrepancy} dias entre DUM e USG precoce (> {maxAllowedDiscrepancy} dias). Conforme FEBRASGO/ACOG, a idade gestacional e DPP devem ser corrigidas pelo Ultrassom.");
        }

        return new ObstetricCalculationResult(
            GestationalAgeByDum: gaDum,
            EddByDum: eddDum,
            GestationalAgeByUsg: gaUsg,
            EddByUsg: eddUsg,
            PreferredReference: GestationalAgeReference.Dum,
            EffectiveGestationalAge: gaDum,
            EffectiveEdd: eddDum,
            DiscrepancyDays: discrepancy,
            IsDumUncertain: false,
            ClinicalRecommendation: $"DUM concordante com USG precoce (diferença de {discrepancy} dias <= {maxAllowedDiscrepancy} dias). DUM mantida como referência oficial.");
    }
}
